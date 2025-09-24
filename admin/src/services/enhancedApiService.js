/**
 * Enhanced API Service - Advanced Connection Management
 * Cải thiện kết nối API với retry logic, connection pooling và monitoring
 */

import axios from "axios";

// Enhanced Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4002/api",
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxConcurrentRequests: 10,
  requestQueueSize: 100,
  healthCheckInterval: 30000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
};

// Request Queue Management
class RequestQueue {
  constructor(maxSize = API_CONFIG.requestQueueSize) {
    this.queue = [];
    this.processing = [];
    this.maxSize = maxSize;
    this.maxConcurrent = API_CONFIG.maxConcurrentRequests;
  }

  add(request) {
    if (this.queue.length >= this.maxSize) {
      throw new Error("Request queue is full");
    }
    this.queue.push(request);
    this.process();
  }

  async process() {
    if (
      this.processing.length >= this.maxConcurrent ||
      this.queue.length === 0
    ) {
      return;
    }

    const request = this.queue.shift();
    this.processing.push(request);

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.processing = this.processing.filter((r) => r !== request);
      this.process(); // Process next request
    }
  }
}

// Circuit Breaker Pattern
class CircuitBreaker {
  constructor(
    threshold = API_CONFIG.circuitBreakerThreshold,
    timeout = API_CONFIG.circuitBreakerTimeout
  ) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit breaker is OPEN");
      } else {
        this.state = "HALF_OPEN";
      }
    }

    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
      }
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.threshold) {
        this.state = "OPEN";
        this.nextAttempt = Date.now() + this.timeout;
      }
      throw error;
    }
  }
}

// Connection Pool with Health Monitoring
class EnhancedApiClient {
  constructor() {
    this.clients = new Map();
    this.requestQueue = new RequestQueue();
    this.circuitBreaker = new CircuitBreaker();
    this.healthStatus = {
      isHealthy: true,
      lastCheck: null,
      latency: 0,
      errors: 0,
      requests: 0,
    };

    this.initializeClients();
    this.startHealthMonitoring();
  }

  initializeClients() {
    // Create multiple axios instances for connection pooling
    for (let i = 0; i < 3; i++) {
      const client = axios.create({
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Client-Version": "2.0.0",
          "X-Request-Source": "admin-panel",
        },
      });

      this.setupInterceptors(client);
      this.clients.set(`client_${i}`, client);
    }
  }

  setupInterceptors(client) {
    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("admin_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request tracking
        config.metadata = {
          startTime: Date.now(),
          requestId: crypto.randomUUID(),
        };

        this.healthStatus.requests++;
        return config;
      },
      (error) => {
        this.healthStatus.errors++;
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        // Track response time
        if (response.config.metadata) {
          const duration = Date.now() - response.config.metadata.startTime;
          this.healthStatus.latency =
            (this.healthStatus.latency + duration) / 2;
        }

        return response;
      },
      async (error) => {
        this.healthStatus.errors++;

        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Retry logic for network errors
        if (this.shouldRetry(error)) {
          return this.retryRequest(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  shouldRetry(error) {
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const isNetworkError = !error.response;
    const isRetryableStatus =
      error.response && retryableStatusCodes.includes(error.response.status);
    const hasRetriesLeft =
      (error.config.__retryCount || 0) < API_CONFIG.retryAttempts;

    return (isNetworkError || isRetryableStatus) && hasRetriesLeft;
  }

  async retryRequest(config) {
    config.__retryCount = (config.__retryCount || 0) + 1;

    // Exponential backoff
    const delay = API_CONFIG.retryDelay * Math.pow(2, config.__retryCount - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Get a fresh client for retry
    const client = this.getAvailableClient();
    return client.request(config);
  }

  getAvailableClient() {
    // Simple round-robin selection
    const clientIds = Array.from(this.clients.keys());
    const selectedId = clientIds[Math.floor(Math.random() * clientIds.length)];
    return this.clients.get(selectedId);
  }

  async request(config) {
    return new Promise((resolve, reject) => {
      const requestTask = {
        execute: async () => {
          return this.circuitBreaker.execute(async () => {
            const client = this.getAvailableClient();
            return client.request(config);
          });
        },
        resolve,
        reject,
      };

      this.requestQueue.add(requestTask);
    });
  }

  // Convenience methods
  async get(url, config = {}) {
    const response = await this.request({ ...config, method: "get", url });
    return response.data;
  }

  async post(url, data, config = {}) {
    const response = await this.request({
      ...config,
      method: "post",
      url,
      data,
    });
    return response.data;
  }

  async put(url, data, config = {}) {
    const response = await this.request({
      ...config,
      method: "put",
      url,
      data,
    });
    return response.data;
  }

  async delete(url, config = {}) {
    const response = await this.request({ ...config, method: "delete", url });
    return response.data;
  }

  async patch(url, data, config = {}) {
    const response = await this.request({
      ...config,
      method: "patch",
      url,
      data,
    });
    return response.data;
  }

  // Health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        const startTime = Date.now();
        await this.get("/health");
        this.healthStatus.latency = Date.now() - startTime;
        this.healthStatus.isHealthy = true;
        this.healthStatus.lastCheck = new Date().toISOString();
      } catch (error) {
        this.healthStatus.isHealthy = false;
        this.healthStatus.lastCheck = new Date().toISOString();
        console.warn("API health check failed:", error.message);
      }
    }, API_CONFIG.healthCheckInterval);
  }

  // Get current health status
  getHealthStatus() {
    return {
      ...this.healthStatus,
      circuitBreakerState: this.circuitBreaker.state,
      queueSize: this.requestQueue.queue.length,
      processingRequests: this.requestQueue.processing.length,
    };
  }

  // Connection diagnostics
  async diagnoseConnection() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      baseURL: API_CONFIG.baseURL,
      health: this.getHealthStatus(),
      tests: {},
    };

    // Test basic connectivity
    try {
      const startTime = Date.now();
      await this.get("/health");
      diagnostics.tests.connectivity = {
        status: "success",
        latency: Date.now() - startTime,
      };
    } catch (error) {
      diagnostics.tests.connectivity = {
        status: "failed",
        error: error.message,
      };
    }

    // Test authentication endpoint
    try {
      await this.get("/auth/verify");
      diagnostics.tests.authentication = { status: "success" };
    } catch (error) {
      diagnostics.tests.authentication = {
        status: "failed",
        error: error.message,
      };
    }

    return diagnostics;
  }
}

// Enhanced Auto Login API with advanced features
class EnhancedAutoLoginAPI {
  constructor(apiClient) {
    this.client = apiClient;
  }

  // Auto Login requests with enhanced error handling
  async getRequests(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      return await this.client.get(`/auto-login/requests?${params}`);
    } catch (error) {
      console.error("Failed to fetch auto login requests:", error);
      throw new Error(`Auto login requests fetch failed: ${error.message}`);
    }
  }

  async createRequest(requestData) {
    try {
      // Validate request data
      this.validateRequestData(requestData);

      return await this.client.post("/auto-login/requests", requestData);
    } catch (error) {
      console.error("Failed to create auto login request:", error);
      throw new Error(`Auto login request creation failed: ${error.message}`);
    }
  }

  async updateRequest(id, updates) {
    try {
      return await this.client.put(`/auto-login/requests/${id}`, updates);
    } catch (error) {
      console.error("Failed to update auto login request:", error);
      throw new Error(`Auto login request update failed: ${error.message}`);
    }
  }

  async deleteRequest(id) {
    try {
      return await this.client.delete(`/auto-login/requests/${id}`);
    } catch (error) {
      console.error("Failed to delete auto login request:", error);
      throw new Error(`Auto login request deletion failed: ${error.message}`);
    }
  }

  async executeRequest(id) {
    try {
      return await this.client.post(`/auto-login/requests/${id}/execute`);
    } catch (error) {
      console.error("Failed to execute auto login request:", error);
      throw new Error(`Auto login request execution failed: ${error.message}`);
    }
  }

  async getTemplates() {
    try {
      return await this.client.get("/auto-login/templates");
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      throw new Error(`Templates fetch failed: ${error.message}`);
    }
  }

  async createTemplate(templateData) {
    try {
      return await this.client.post("/auto-login/templates", templateData);
    } catch (error) {
      console.error("Failed to create template:", error);
      throw new Error(`Template creation failed: ${error.message}`);
    }
  }

  async getSchedules() {
    try {
      return await this.client.get("/auto-login/schedules");
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      throw new Error(`Schedules fetch failed: ${error.message}`);
    }
  }

  async createSchedule(scheduleData) {
    try {
      return await this.client.post("/auto-login/schedules", scheduleData);
    } catch (error) {
      console.error("Failed to create schedule:", error);
      throw new Error(`Schedule creation failed: ${error.message}`);
    }
  }

  async getMonitoringData() {
    try {
      return await this.client.get("/auto-login/monitoring");
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
      throw new Error(`Monitoring data fetch failed: ${error.message}`);
    }
  }

  validateRequestData(data) {
    const required = ["platform", "credentials"];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    if (
      data.credentials &&
      (!data.credentials.username || !data.credentials.password)
    ) {
      throw new Error("Credentials must include username and password");
    }
  }
}

// Create singleton instances
const enhancedApiClient = new EnhancedApiClient();
const enhancedAutoLoginAPI = new EnhancedAutoLoginAPI(enhancedApiClient);

// Export enhanced API services
export {
  enhancedApiClient,
  enhancedAutoLoginAPI,
  EnhancedApiClient,
  EnhancedAutoLoginAPI,
};

export default enhancedApiClient;
